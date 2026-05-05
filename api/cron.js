export default async function handler(req, res) {
  // 1. 获取当前北京时间
  const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Shanghai"}));
  
  // 提取当前的 月份 和 日期，并格式化为 "MM-DD" 的形式（例如 "04-19"）
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const todayStr = `${month}-${day}`;

  // 2. 课程基础信息库 (包含时间、教师、线下教室、线上直播链接)
  const coursesInfo = {
    "国家开放大学学习指南": { time: "09:30-12:00", teacher: "梁健超", room: "A603", link: "https://live.polyv.cn/watch/2258347" },
    "心理健康教育": { time: "09:30-12:00", teacher: "蔡婧", room: "A602", link: "https://live.polyv.cn/watch/949142" },
    "中国近现代史纲要": { time: "14:30-17:00", teacher: "路成荣", room: "A203", link: "https://live.polyv.cn/watch/2275038" },
    "人文英语3": { time: "14:30-17:00", teacher: "梁悦瑶", room: "A403", link: "https://live.polyv.cn/watch/1886427" }
  };

  // 3. 2026春季具体上课日期排期表 (左边是日期，右边是当天的课程)
  const scheduleByDate = {
    "04-19": "人文英语3",
    "04-25": "国家开放大学学习指南",
    "04-26": "人文英语3",
    "05-10": "人文英语3",
    "05-16": "心理健康教育",
    "05-17": "人文英语3",
    "05-23": "中国近现代史纲要",
    "05-24": "人文英语3",
    "05-30": "心理健康教育",
    "05-31": "人文英语3",
    "06-06": "中国近现代史纲要",
    "06-07": "人文英语3",
    "06-13": "心理健康教育",
    "06-14": "人文英语3",
    "06-27": "中国近现代史纲要",
    "06-28": "人文英语3"
  };

  // 去排期表里查一下今天有没有课
  const courseName = scheduleByDate[todayStr];

  // 如果今天没课（比如周一到周五，或者空闲的周末），直接结束运行，不发消息打扰你
  if (!courseName) {
    return res.status(200).json({ message: `${todayStr} 今天没课，好好休息！` });
  }

  // 提取今天这门课的具体信息
  const info = coursesInfo[courseName];

  // 4. 拼接要发送给你的企微消息文本
  const textContent = `📚 今日上课提醒 (${todayStr})\n\n` +
                      `📖 课程：${courseName}\n` +
                      `👨‍🏫 教师：${info.teacher}\n` +
                      `⏰ 时间：${info.time}\n` +
                      `📍 教室：${info.room}\n` +
                      `🔗 直播：${info.link}`;

  // 5. 调用企业微信 Webhook 发送消息
  const WEBHOOK_URL = process.env.WX_WEBHOOK_URL; 

  if (!WEBHOOK_URL) {
      return res.status(500).json({ error: "环境变量 WX_WEBHOOK_URL 未配置！" });
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: "text",
        text: { content: textContent }
      })
    });
    
    const result = await response.json();
    res.status(200).json({ success: true, course: courseName, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
