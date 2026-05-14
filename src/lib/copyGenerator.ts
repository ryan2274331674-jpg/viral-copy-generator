export type FormState = {
  topic: string;
  platform: string;
  accountType: string;
  style: string;
};

export type GeneratedResult = {
  titles: string[];
  hooks: string[];
  douyinScript: string;
  xiaohongshuPost: string;
  commentGuides: string[];
  dmScripts: string[];
};

export const platforms = ["抖音", "小红书", "视频号", "快手", "B站"];
export const accountTypes = ["个人IP", "知识科普", "好物种草", "本地生活", "职场成长", "美食探店"];
export const styles = ["犀利直接", "温柔种草", "反差悬念", "专业可信", "轻松幽默", "情绪共鸣"];

const titleTemplates = [
  "别再盲目做{topic}了，真正有效的是这3步",
  "我用{topic}跑通了一套适合{platform}的爆款公式",
  "{accountType}账号做{topic}，最容易忽略的细节在这里",
  "普通人也能学会的{topic}内容打法",
  "{topic}想出圈，先把这5个误区避开",
  "为什么你的{topic}没人看？问题可能不在选题",
  "把{topic}讲透之后，我发现爆款都有同一个结构",
  "{style}风格的{topic}，这样写更容易被收藏",
  "从0到1做{topic}，这份清单建议直接照着用",
  "刷到就是赚到：{topic}的高转化文案模板",
  "{topic}内容别硬讲，用这个开头完播率更稳",
  "适合{accountType}的{topic}选题库，我先整理好了",
];

const hookTemplates = [
  "如果你正在做{topic}，先别急着发布，听完这30秒再改。",
  "很多人做{topic}卡住，不是能力不够，而是顺序反了。",
  "这条内容可能会颠覆你对{topic}的理解。",
  "我把{platform}上容易爆的{topic}拆了一遍，发现了一个共同点。",
  "你以为用户想看{topic}，其实他们想要的是这个结果。",
  "做{accountType}账号的人，千万别把{topic}讲得太满。",
  "这个{topic}方法很简单，但大多数人第一步就做错了。",
  "今天不讲虚的，直接给你一套能拿去用的{topic}文案。",
  "如果只能给{topic}新手一个建议，我会先说这件事。",
  "别划走，接下来这句话能帮你少走很多弯路。",
  "我试了很多{topic}写法，最后留下的是这一个。",
  "不是{topic}没流量，是你的第一句话没让人停下来。",
];

const commentGuideTemplates = [
  "想要完整模板，评论区打“模板”，我整理给你。",
  "你现在最卡的是选题、标题还是转化？评论区告诉我。",
  "如果这条对你有用，先收藏，晚上直接照着改一版。",
  "还想看哪个行业的拆解？留言一个关键词。",
  "你觉得最难的是开头还是结尾？我在评论区继续拆。",
  "需要我帮你看一眼账号定位，可以评论“定位”。",
];

const dmTemplates = [
  "你好，我看到了你的留言。你现在更想解决选题、文案还是转化？我可以按你的账号情况给你一版思路。",
  "这边有一份适合{accountType}账号的{topic}文案清单，你发我账号方向，我给你匹配一下。",
  "如果你想把{topic}做成稳定内容栏目，我可以先帮你梳理3个可持续选题方向。",
  "你方便发一下目前账号主页吗？我先看定位和内容结构，再给你更具体的建议。",
  "我这里有一套从标题、开头到转化话术的模板，适合先快速跑一版内容验证。",
  "收到。我建议你先从一个低成本选题开始试，确认数据后再放大。你的账号现在主要卖产品还是做个人IP？",
];

const replaceTokens = (template: string, form: FormState) =>
  template
    .replaceAll("{topic}", form.topic.trim() || "你的主题")
    .replaceAll("{platform}", form.platform)
    .replaceAll("{accountType}", form.accountType)
    .replaceAll("{style}", form.style);

const rotate = <T,>(items: T[], offset: number) => {
  const index = offset % items.length;
  return [...items.slice(index), ...items.slice(0, index)];
};

const takeMockItems = (templates: string[], count: number, form: FormState, seed: number) =>
  rotate(templates, seed)
    .slice(0, count)
    .map((template) => replaceTokens(template, form));

export const generateMockResult = (form: FormState, seed: number): GeneratedResult => {
  const topic = form.topic.trim() || "短视频内容";
  const angle = form.style === "专业可信" ? "用清晰结构降低理解成本" : "先抓情绪，再给方法";
  const promise = form.platform === "小红书" ? "收藏和转粉" : "停留、互动和转化";

  return {
    titles: takeMockItems(titleTemplates, 10, form, seed),
    hooks: takeMockItems(hookTemplates, 10, form, seed + 3),
    douyinScript: `你是不是也发现，做${topic}最难的不是没内容，而是发出去之后没人愿意停下来看？

其实爆款文案不是堆金句，而是把用户此刻最在意的问题先说出来。

第一步，开头直接点痛点。不要说“今天分享一个方法”，而是说“如果你做${topic}一直没结果，可能是第一句话就错了”。

第二步，把方法拆成三件小事：用户现在遇到什么问题、为什么会这样、下一条内容应该怎么改。

第三步，结尾给一个明确动作。比如让用户评论关键词、收藏清单，或者私信领取模板。

适合${form.accountType}账号的${topic}内容，核心不是讲得多专业，而是让用户马上觉得：这条内容和我有关。

你先照这个结构改一条，数据通常会比单纯罗列知识更稳。`,
    xiaohongshuPost: `标题：${topic}想被收藏，先把文案改成这个结构

正文：
很多人做${topic}，一上来就把干货全部倒出来，结果用户没有耐心看完。

更适合${form.platform}的写法是：

1. 先说场景：用户正在经历什么
2. 再说误区：为什么以前的方法没效果
3. 给出步骤：让用户能马上照做
4. 最后收口：提醒收藏或评论关键词

我建议${form.accountType}账号先固定一个栏目，比如“每天拆一个${topic}案例”。这样用户更容易形成期待，也更容易持续关注。

这套写法的重点是${angle}，让内容同时具备${promise}的空间。

结尾可以这样写：
如果你也在做${topic}，先收藏这篇，下次写文案前照着检查一遍。`,
    commentGuides: takeMockItems(commentGuideTemplates, 5, form, seed + 5),
    dmScripts: takeMockItems(dmTemplates, 5, form, seed + 7),
  };
};
