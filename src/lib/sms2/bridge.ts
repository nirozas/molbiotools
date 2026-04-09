
/**
 * SMS2 React Bridge
 * Provides a virtual environment for Sequence Manipulation Suite 2 scripts.
 */

export interface SMSToolResult {
  title: string;
  content: string; // HTML content or plain text
}

export class SMS2Bridge {
  private outputBuffer: string = "";
  private currentTitle: string = "";

  constructor() {
    this.reset();
  }

  reset() {
    this.outputBuffer = "";
    this.currentTitle = "";
  }

  // Mock document object for SMS2
  getMockDocument(inputValue: string) {
    const bridge = this;
    return {
      forms: [{
        elements: [{
          value: inputValue
        }]
      }],
      write: (text: string) => { bridge.outputBuffer += text; }
    };
  }

  // Global functions required by SMS2
  getEnvironment() {
    const bridge = this;
    const env: any = {
      outputWindow: {
        document: {
          write: (text: string) => { bridge.outputBuffer += text; },
          close: () => {},
        },
        status: "",
        focus: () => {},
      },
      alert: (msg: string) => console.warn("SMS2 Alert:", msg),
      openWindow: (title: string) => { bridge.currentTitle = title; },
      closeWindow: () => {},
    };
    env.open = () => env.outputWindow;
    return env;
  }

  getOutput() {
    return {
      title: this.currentTitle,
      content: this.outputBuffer
    };
  }
}
