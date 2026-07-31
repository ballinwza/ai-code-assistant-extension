import * as vscode from 'vscode';
import axios from 'axios';

export class SidebarProvider implements vscode.WebviewViewProvider {
  
  public static readonly viewType = 'code-assistant-sidebar';
  private _view?: vscode.WebviewView;
  private _selectedCode: string = '';
  private _selectedFile: string = '';
  private _backendUrl: string = 'http://localhost:8000';
  private _abortController: AbortController | null = null;


  constructor(private readonly _extensionUri: vscode.Uri) {
    const config = vscode.workspace.getConfiguration('codeAssistant');
    this._backendUrl = config.get<string>('backendUrl', 'http://localhost:8000');
  }

  public sendCodeToChat(code: string, fileName: string) {
    if (this._view) {
      // 1. สั่งเปิด/แสดงหน้าต่าง Sidebar ขึ้นมา
      this._view.show?.(true);
      this._selectedCode=code;
      this._selectedFile=fileName;

      // 2. ส่งข้อความผ่าน postMessage ไปบอก React UI
      this._view.webview.postMessage({
        type: 'selection-updated',
        code: code,
        file: fileName
      });
    }
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // รับข้อความจาก React UI
    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === 'cancel-assistant') {
        if (this._abortController) {
          this._abortController.abort(); // สั่งตัด HTTP Request ของ Axios
          this._abortController = null;
        }
        return;
      }

      if (data.type === 'ask-assistant') {
        try {
          this._abortController = new AbortController();

          let fullQuestion = data.text;
          if (this._selectedCode) {
            fullQuestion = `[Context จากไฟล์: ${this._selectedFile}]\n\`\`\`\n${this._selectedCode}\n\`\`\`\n\nคำถาม: ${data.text}`;
          }

          // ดึงชื่อโฟลเดอร์ Root ที่เปิดอยู่ใน VS Code ปัจจุบัน
          const workspaceFolders = vscode.workspace.workspaceFolders;
          const currentRepoName = workspaceFolders && workspaceFolders.length > 0 
            ? workspaceFolders[0].name 
            : undefined;

          // ยิง HTTP POST ไปหา FastAPI Backend
          const response = await axios.post(`${this._backendUrl}/api/chat/ask`, {
            question: fullQuestion,
            chat_history: data.history,
            repo_name: currentRepoName,
          },{
            signal: this._abortController.signal
          });
          const reviewMarkdown = response.data.answer;
          const resultText = reviewMarkdown[0]?.text ?? "ไม่พบคำตอบ";
          // ส่งคำตอบกลับไปหา React UI
          webviewView.webview.postMessage({
            type: 'bot-response',
            text: resultText,
          });
        } catch (error) {
          if (axios.isCancel(error)){
            console.log('Request was canceled by user.');
            return;
          }

          webviewView.webview.postMessage({
            type: 'bot-response',
            text: `❌ Fail connected FastAPI Server : ${error}`
          });
        } finally {
          this._abortController = null;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist-webview', 'sidebar.js')
    );

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}