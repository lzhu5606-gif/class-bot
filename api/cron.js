module.exports = async function(req, res) {
  // 1. 获取北京时间
  const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Shanghai"}));
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const todayStr = `${month}-${day}`;
  const hour = date.getHours(); // 获取当前是几点 (例如 9, 14, 18)

  // 2. 课程基础信息
  const coursesInfo = {
    "国家开放大学学习指南": { time: "09:30-12:00", teacher: "梁健超", room: "A603", link: "https://live.polyv.cn/watch/2258347" },
    "心理健康教育": { time: "09:30-12:00", teacher: "蔡婧", room: "A602", link: "https://live.polyv.cn/watch/949142" },
    "中国近现代史纲要": { time: "14:30-17:00", teacher: "路成荣", room: "A203", link: "https://live.polyv.cn/watch/2275038" },
    "人文英语3": { time: "14:30-17:00", teacher: "梁悦瑶", room: "A403", link: "https://live.polyv.cn/watch/1886427" }
  };

  // 3. 排期表
  const scheduleByDate = {
    "04-19": "人文英语3", "04-25": "国家开放大学学习指南", "04-26": "人文英语3",
    "05-10": "人文英语3", "05-16": "心理健康教育", "05-17": "人文英语3",
    "05-23": "中国近现代史纲要", "05-24": "人文英语3", "05-30": "心理健康教育",
    "05-31": "人文英语3", "06-06": "中国近现代史纲要", "06-07": "人文英语3",
    "06-13": "心理健康教育", "06-14": "人文英语3", "06-27": "中国近现代史纲要",
    "06-28": "人文英语3"
  };

  const courseName = scheduleByDate[todayStr];
  let textContent = "";
  let shouldSend = false;

  // --- 智能时间判断核心逻辑 ---
  if (!courseName) {
    if (hour === 9) {
      // 没课的日子，只在早上 9 点发一次温馨提示
      shouldSend = true;
      textContent = `☕ 早上好！(${todayStr})\n\n今天课表上没有安排课程，好好休息或者自主学习吧！`;
    } else {
      // 下午和晚上直接休眠
      return res.status(200).json({ message: "今天没课，下午/晚上已自动保持安静。" });
    }
  } else {
    const info = coursesInfo[courseName];
    // 解析出这门课的开始小时数。例如 "14:30-17:00" 会提取出数字 14
    const startHour = parseInt(info.time.split(":")[0], 10);

    if (hour === 9) {
      // 规则 A：只要今天有课，早上 9 点雷打不动推送一次全天预告
      shouldSend = true;
    } else if (hour === 14 && startHour >= 12 && startHour < 18) {
      // 规则 B：下午 14:00 醒来，发现上课时间是下午（12点~18点之间），推送！
      shouldSend = true;
    } else if (hour === 18 && startHour >= 18) {
      // 规则 C：晚上 18:30 醒来，发现上课时间是晚上（18点以后），推送！
      shouldSend = true;
    } else {
      // 不符合上述情况（比如上午的课在下午闹钟响了，或者下午的课晚上闹钟响了），直接跳过
      return res.status(200).json({ message: "当前时间与上课时间不匹配，无需重复推送此课程。" });
    }

    if (shouldSend) {
      textContent = `📚 今日上课提醒 (${todayStr})\n\n` +
                    `📖 课程：${courseName}\n` +
                    `👨‍🏫 教师：${info.teacher}\n` +
                    `⏰ 时间：${info.time}\n` +
                    `📍 教室：${info.room}\n` +
                    `🔗 直播：${info.link}`;
    }
  }
  // --- 逻辑判断结束 ---

  const WEBHOOK_URL = process.env.WX_WEBHOOK_URL; 
  if (!WEBHOOK_URL) return res.status(500).json({ error: "环境变量未配置" });

  try {
    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: "text",
        text: { content: textContent }
      })
    });
    
    const result = await response.json();
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
