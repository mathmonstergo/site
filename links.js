/* ============================================================
 *  导航站配置文件
 *  —— 平时你只需要改这一个文件,就能增删链接、改标题。
 *  改完保存、推到 GitHub,Vercel 会自动重新部署。
 * ============================================================ */

/* 站点信息 -------------------------------------------------- */
const SITE = {
  brand: "DECK", //  左上角的站名(英文短词最好看,如 DECK / ORBIT / NEXUS)
  owner: "森森大魔王", //  你的名字 / handle
  tagline: "AI-native PM · 把想法做成产品", //  一句话标语
  github: "https://github.com/mathmonstergo", //  右下角 GitHub 链接(换成你的主页)

  //  在搜索框输入关键词后,若导航里没有匹配项,回车会用下面的引擎去搜
  searchEngine: {
    name: "Google",
    url: "https://www.google.com/search?q=",
    //  想用别的搜索引擎,把上面两行换掉即可,例如:
    //  name: "Bing",  url: "https://www.bing.com/search?q=",
    //  name: "百度",  url: "https://www.baidu.com/s?wd=",
  },

  //  背景音乐(右下角小播放器)————————————————————————————
  //  浏览器规定:必须等你和页面第一次互动(点击 / 按键,滚动不算)才能出声,
  //  所以是「一进来待命,你一点 / 一按音乐就循环响起」。src 设为 "" 可彻底关掉播放器。
  //  播放时整页背景会随音乐频谱起伏(底部光柱 + 低音辉光);换成不支持跨域 CORS 的流会失效,SomaFM 各台和本地 mp3 都正常。
  music: {
    src: "https://ice1.somafm.com/defcon-128-mp3", //  默认:SomaFM「DEF CON Radio」公共电台,赛博/黑客味儿
    title: "DEFCON·RADIO",                          //  没有「正在播放」信息时显示的名字
    volume: 0.45,                                   //  默认音量 0~1
    somaChannel: "defcon",                          //  显示该 SomaFM 频道的「正在播放」歌名;换台改这里;放自己的歌请删掉这行

    //  ▸ 想放自己的歌:把一个 mp3 放进项目根目录的 music/ 文件夹,然后:
    //      src: "music/你的歌.mp3",  title: "歌名",  并删掉上面的 somaChannel 行
    //  ▸ 想换别的公共电台(都来自 SomaFM;箭头后是对应的 somaChannel 值):
    //      Groove Salad(慵懒电子):  https://ice1.somafm.com/groovesalad-128-mp3  →  somaChannel: "groovesalad"
    //      Synphaera(空灵合成器):    https://ice1.somafm.com/synphaera-128-mp3   →  somaChannel: "synphaera"
    //      Lush(梦幻 vocal):         https://ice1.somafm.com/lush-128-mp3        →  somaChannel: "lush"
  },
};

/* 链接分类 -------------------------------------------------- *
 *  每个分类:{ name: "分类名", items: [ ...链接 ] }
 *  每个链接:{ name: "名称", url: "网址", desc: "一句话描述(可留空)" }
 *  图标会根据网址自动抓取,不用你手动找。
 * ---------------------------------------------------------- */
const CATEGORIES = [
  {
    name: "AI御三家",
    items: [
      { name: "ChatGPT",    url: "https://chat.openai.com",      desc: "OpenAI 通用对话" },
      { name: "Claude",     url: "https://claude.ai",            desc: "长文本 / 编码最强" },
      { name: "Gemini",     url: "https://gemini.google.com",    desc: "Google 多模态" },
      { name: "DeepSeek",   url: "https://chat.deepseek.com",    desc: "国产开源强模型" },
      { name: "Perplexity", url: "https://www.perplexity.ai",    desc: "AI 搜索引擎" },
    ],
  },
  {
    name: "个人常用",
    items: [
      { name: "GitHub",    url: "https://github.com/mathmonstergo",          desc: "个人github" },
      { name: "LinuxDo",   url: "https://linux.do",                         desc: "学AI，上L站！" },
      { name: "日志",      url: "https://typecho.sensendemoou.cn",           desc: "想起来就记一记" },
      { name: "Monitor",   url: "https://vps.iamsen.com",                    desc: "服务器探针监控" },
      { name: "3x-ui",     url: "https://xui.iamsen.com/1ZXmgVCXEFgHWlmCzZ", desc: "自用节点面板" },
      { name: "PDF",       url: "https://pdf.iamsen.com",                    desc: "Stirling-PDF 工具箱" },
      { name: "Bitwarden", url: "https://pwd.iamsen.com",                    desc: "自用" },
      { name: "Mail",      url: "https://mail.iamsen.com",                   desc: "自用" },
    ],
  },
];
