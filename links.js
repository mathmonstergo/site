/* ============================================================
 *  导航站配置文件
 *  —— 平时你只需要改这一个文件,就能增删链接、改标题。
 *  改完保存、推到 GitHub,Vercel 会自动重新部署。
 * ============================================================ */

/* 站点信息 -------------------------------------------------- */
const SITE = {
  brand: "DECK", //  左上角的站名(英文短词最好看,如 DECK / ORBIT / NEXUS)
  owner: "Adam", //  你的名字 / handle
  tagline: "AI-native PM · 把想法做成产品", //  一句话标语
  github: "https://github.com/", //  右下角 GitHub 链接(换成你的主页)

  //  在搜索框输入关键词后,若导航里没有匹配项,回车会用下面的引擎去搜
  searchEngine: {
    name: "Google",
    url: "https://www.google.com/search?q=",
    //  想用别的搜索引擎,把上面两行换掉即可,例如:
    //  name: "Bing",  url: "https://www.bing.com/search?q=",
    //  name: "百度",  url: "https://www.baidu.com/s?wd=",
  },
};

/* 链接分类 -------------------------------------------------- *
 *  每个分类:{ name: "分类名", items: [ ...链接 ] }
 *  每个链接:{ name: "名称", url: "网址", desc: "一句话描述(可留空)" }
 *  图标会根据网址自动抓取,不用你手动找。
 * ---------------------------------------------------------- */
const CATEGORIES = [
  {
    name: "AI 助手",
    items: [
      { name: "ChatGPT",    url: "https://chat.openai.com",      desc: "OpenAI 通用对话" },
      { name: "Claude",     url: "https://claude.ai",            desc: "长文本 / 编码最强" },
      { name: "Gemini",     url: "https://gemini.google.com",    desc: "Google 多模态" },
      { name: "Perplexity", url: "https://www.perplexity.ai",    desc: "AI 搜索引擎" },
      { name: "DeepSeek",   url: "https://chat.deepseek.com",    desc: "国产开源强模型" },
      { name: "Kimi",       url: "https://kimi.moonshot.cn",     desc: "超长上下文" },
    ],
  },
  {
    name: "AI 开发 / 平台",
    items: [
      { name: "Anthropic Console", url: "https://console.anthropic.com", desc: "Claude API 后台" },
      { name: "OpenAI Platform",   url: "https://platform.openai.com",   desc: "OpenAI API 后台" },
      { name: "Hugging Face",      url: "https://huggingface.co",        desc: "模型 / 数据集社区" },
      { name: "Replicate",         url: "https://replicate.com",         desc: "一键跑模型 API" },
      { name: "Dify",              url: "https://dify.ai",               desc: "LLM 应用编排" },
      { name: "Coze",              url: "https://www.coze.cn",           desc: "字节 Bot 搭建" },
    ],
  },
  {
    name: "AI 编码",
    items: [
      { name: "Cursor",       url: "https://cursor.com",       desc: "AI 代码编辑器" },
      { name: "v0",           url: "https://v0.dev",           desc: "AI 生成前端 UI" },
      { name: "GitHub Copilot", url: "https://github.com/features/copilot", desc: "代码补全" },
      { name: "Claude Code",  url: "https://claude.com/claude-code", desc: "终端里的 AI 工程师" },
    ],
  },
  {
    name: "产品 / 设计",
    items: [
      { name: "Figma",      url: "https://figma.com",        desc: "设计协作" },
      { name: "Notion",     url: "https://notion.so",        desc: "文档 / 知识库" },
      { name: "Linear",     url: "https://linear.app",       desc: "现代项目管理" },
      { name: "Excalidraw", url: "https://excalidraw.com",   desc: "手绘风白板" },
      { name: "Miro",       url: "https://miro.com",         desc: "无限白板" },
    ],
  },
  {
    name: "开发 / 部署",
    items: [
      { name: "GitHub",     url: "https://github.com",          desc: "代码托管" },
      { name: "Vercel",     url: "https://vercel.com",          desc: "前端一键部署" },
      { name: "Cloudflare", url: "https://dash.cloudflare.com", desc: "域名 / CDN" },
      { name: "StackBlitz", url: "https://stackblitz.com",      desc: "在线 IDE" },
    ],
  },
  {
    name: "灵感 / 资讯",
    items: [
      { name: "Hacker News",     url: "https://news.ycombinator.com",     desc: "技术圈头条" },
      { name: "Product Hunt",    url: "https://producthunt.com",          desc: "新产品发现" },
      { name: "arXiv",           url: "https://arxiv.org",                desc: "AI 论文" },
      { name: "Lenny's",         url: "https://www.lennysnewsletter.com", desc: "PM 必读 newsletter" },
      { name: "即刻",            url: "https://web.okjike.com",           desc: "国内科技社区" },
      { name: "少数派",          url: "https://sspai.com",                desc: "效率 / 工具" },
    ],
  },
  {
    name: "我的",
    items: [
      { name: "GitHub 主页", url: "https://github.com/",  desc: "← 换成你的" },
      { name: "我的简历",    url: "#",                     desc: "← 放简历链接" },
      { name: "客服 RAG 项目", url: "#",                  desc: "← 你的主推项目" },
      { name: "邮箱",        url: "mailto:you@example.com", desc: "← 换成你的邮箱" },
    ],
  },
];
