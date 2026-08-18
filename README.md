<h1 align="center">
  <img src='./doc/statics/icon.png' width='40%'>
  <div>
    <b>Unbundled</b>
    A Chatbox.ai fork without <b>gated features</b>
  </div>
</h1>
<p align="center">
  <em>
    Your Ultimate AI Copilot on the Desktop.
    <br />
    A free, privacy-focused desktop AI client with knowledge bases, web search, and tool calling for ChatGPT, Claude and other LLMs
  </em>
</p>

## Fork Notes

Fork of [Chatbox](https://github.com/chatboxai/chatbox). Changes vs upstream:

- [x] **Telemetry removed**
  - Sentry, Plausible, Google Analytics
  - first-party click tracking, page views, and conversion events
  - remote error-reporting code and docs
- [x] **Chatbox AI pro account, license keys, and billing removed**
  - login, license keys, LemonSqueezy payment
  - premium, quota, and reward UI
  - pro onboarding guide and Chatbox AI provider settings
- [x] **Chatbox AI model provider removed**
  - Chatbox-hosted chat models from the model selector
  - Chatbox image and paint models
  - no longer the default chat model
- [x] **Chatbox partner backends unbundled**
  - built-in Chatbox web search provider
  - cloud/remote KB parser and the remote API client
  - partner API calls disabled
  - remote feature flags, marketing dialog, and copilot usage analytics removed
  - bundled copilot catalog offline with browse/search
  - local-only: chat sessions, settings, user-created copilots, bundled builtin skill seeds
  - HTML artifact preview runs locally
  - publish to VibeDrop with an auto or user-owned API key
- [x] **English only**
  - non-English locales, translation scripts, and language picker removed
  - English i18n runtime kept
- [x] **Identity and theme**
  - package renamed to `chatbox-unbundled`
  - icons and splash replaced
  - color presets and CSS cleaned up
  - copyright notice [added](LICENSE) for metaory (still GPL-3)
- [x] **CI and tooling**
  - GitHub Actions CI and Cloudflare Pages deploy
  - dead webpack/`.erb` leftovers and unused deps removed
  - pack scripts live under `scripts/`
- [ ] Add dynamic React and Vue component rendering in preview

---

<p align="center">
  <a href="./doc/statics/snapshot_light.png">
    <img src="./doc/statics/snapshot_light.png" width="400"/>
  </a>
  <a href="./doc/statics/snapshot_dark.png">
    <img src="./doc/statics/snapshot_dark.png" width="400"/>
  </a>
</p>

---

## Download

### Desktop

<table style="width: 100%">
  <tr>
    <td width="25%" align="center">
      <b>Windows</b>
    </td>
    <td width="25%" align="center" colspan="2">
      <b>MacOS</b>
    </td>
    <td width="25%" align="center">
      <b>Linux</b>
    </td>
  </tr>
  <tr style="text-align: center">
    <td align="center" valign="middle">
      <a href='https://metaory.app/?c=download-windows'>
        <img src='./doc/statics/windows.png' style="height:24px; width: 24px" />
        <br />
        <b>Setup.exe</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://metaory.app/?c=download-mac-intel'>
        <img src='./doc/statics/mac.png' style="height:24px; width: 24px" />
        <br />
        <b>Intel</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://metaory.app/?c=download-mac-aarch'>
        <img src='./doc/statics/mac.png' style="height:24px; width: 24px" />
        <br />
        <b style="white-space: nowrap;">Apple Silicon</b>
      </a>
    </td>
    <td align="center" valign="middle">
      <a href='https://metaory.app/?c=download-linux'>
        <img src='./doc/statics/linux.png' style="height:24px; width: 24px" />
        <br />
        <b>AppImage</b>
      </a>
    </td>
  </tr>
</table>

### iOS/Android

<a href='https://apps.apple.com/app/metaory/id6471368056' style='margin-right: 4px'>
<img src='./doc/statics/app_store.webp' style="height:38px;" />
</a>
<a href='https://github.com/metaory/chatbox-unbundled/releases' style='margin-right: 4px'>
<img src='./doc/statics/google_play.png' style="height:38px;" />
</a>
<a href='https://metaory.app/install?download=android_apk' style='margin-right: 4px; display: inline-flex; justify-content: center'>
<img src='./doc/statics/android.png' style="height:28px; display: inline-block" />
.APK
</a>

For more information: [chatbox-unbundled.pages.dev](https://chatbox-unbundled.pages.dev/)

## Quick Start

### For End Users

1. Download the appropriate installer for your platform from the [releases page](https://github.com/metaory/chatbox-unbundled/releases)
2. Install and launch chatbox-unbundled
3. Configure your AI provider (OpenAI, Claude, etc.) in settings
4. Start chatting!

### System Requirements

| Platform | Minimum Version                            | Architecture        |
| -------- | ------------------------------------------ | ------------------- |
| Windows  | Windows 10                                 | x64                 |
| macOS    | macOS 11 (Big Sur)                         | Intel/Apple Silicon |
| Linux    | Ubuntu 20.04+ / AppImage supported distros | x64                 |

## Features

### 🤖 AI Model Support

- **Support for Multiple LLM Providers**  
  :gear: Seamlessly integrate with a variety of cutting-edge language models:

  - OpenAI (ChatGPT)
  - Azure OpenAI
  - Claude
  - Google Gemini Pro
  - Ollama (enable access to local models like llama2, Mistral, Mixtral, codellama, vicuna, yi, and solar)
  - ChatGLM-6B

- **Image Generation with Dall-E-3**  
  :art: Create the images of your imagination with Dall-E-3.

- **Enhanced Prompting**  
  :speech_balloon: Advanced prompting features to refine and focus your queries for better responses.

### 🖥️ User Experience

- **Local Data Storage**  
  :floppy_disk: Your data remains on your device, ensuring it never gets lost and maintains your privacy.

- **No-Deployment Installation Packages**  
  :package: Get started quickly with downloadable installation packages. No complex setup necessary!

- **Ergonomic UI & Dark Theme**  
  :new_moon: A user-friendly interface with a night mode option for reduced eye strain during extended use.

- **Keyboard Shortcuts**  
  :keyboard: Stay productive with shortcuts that speed up your workflow.

- **Streaming Reply**  
  :arrow_forward: Provide rapid responses to your interactions with immediate, progressive replies.

### 📄 Content & Formatting

- **Markdown, Latex & Code Highlighting**  
  :scroll: Generate messages with the full power of Markdown and Latex formatting, coupled with syntax highlighting for various programming languages, enhancing readability and presentation.

- **Prompt Library & Message Quoting**  
  :books: Save and organize prompts for reuse, and quote messages for context in discussions.

### 👥 Collaboration & Sharing

- **Team Collaboration**  
  :busts_in_silhouette: Collaborate with ease and share OpenAI API resources among your team. [Learn More](./team-sharing/README.md)

### 🌐 Platform Availability

- **Cross-Platform Desktop**  
  :computer: chatbox-unbundled is ready for Windows, Mac, and Linux users.

- **Web Version**  
  :globe_with_meridians: Use the web application on any device with a browser, anywhere.

- **Mobile Apps**  
  :phone: Native iOS and Android applications for on-the-go access.

### ✨ More Features

- **And More...**  
  :sparkles: Constantly enhancing the experience with new features!

## FAQ

- [Frequently Asked Questions](./doc/FAQ.md)

## How to Contribute

We welcome contributions from the community! Here's how you can help make chatbox-unbundled better:

### 🐛 Reporting Issues

- Use [GitHub Issues](https://github.com/metaory/chatbox-unbundled/issues) to report bugs or request features
- Before creating a new issue, please search existing issues to avoid duplicates
- Provide detailed information including steps to reproduce, expected behavior, and screenshots if applicable

### 🔧 Pull Requests

1. Fork the repository and create your branch from `master`
2. Make your changes and ensure the code follows our coding standards
3. Test your changes thoroughly
4. Update documentation if needed
5. Submit a pull request with a clear description of the changes

### 📖 Documentation

- Improve README, API documentation, or user guides
- Fix typos or clarify unclear instructions
- Add examples and tutorials

### 🌟 Other Ways to Contribute

- Star the repository to show your support
- Share chatbox-unbundled with others
- Answer questions in [GitHub Discussions](https://github.com/metaory/chatbox-unbundled/discussions)
- Provide feedback and suggestions

**Thank you for contributing! 🙏**

## Development

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.x – v22.x) - [Download here](https://nodejs.org/)
- **pnpm** (v11.x) - Install via `corepack enable && corepack prepare pnpm@latest --activate`
- **Git** - [Download here](https://git-scm.com/)

### Quick Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/metaory/chatbox-unbundled.git
   cd chatbox-unbundled
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm run dev
   ```
   The application will start in development mode with hot-reload enabled.

### Build Commands

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm run dev`         | Start development server with hot-reload |
| `pnpm run package`     | Build and package for current platform   |
| `pnpm run package:all` | Build and package for all platforms      |
| `pnpm run build`       | Build for production without packaging   |
| `pnpm run lint`        | Run Biome to check code quality          |
| `pnpm run test`        | Run Vitest test suite                    |

### Project Structure

```
chatbox-unbundled/
├── src/
│   ├── main/               # Electron main process
│   ├── renderer/           # React renderer (UI)
│   ├── preload/            # Electron preload scripts
│   └── shared/             # Shared utilities
├── doc/                    # Documentation and assets
├── resources/              # App resources and icons
├── team-sharing/           # Team collaboration features
└── package.json            # Project configuration
```

### Development Tips

- Use `pnpm run lint` before committing to ensure code quality
- Follow the existing code style and patterns
- Test your changes on both light and dark themes
- Ensure cross-platform compatibility when making UI changes

### Troubleshooting

**Issue**: `pnpm install` fails

- **Solution**: Ensure you're using pnpm (not npm or yarn) and Node.js version is within the required range. Run `corepack enable` if pnpm is not found.

**Issue**: Build fails on Windows

- **Solution**: Run `pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"` if using Git Bash

**Issue**: Changes not reflecting in development

- **Solution**: Stop the dev server, delete `node_modules/.vite`, and restart

---

## License

[LICENSE](./LICENSE)
