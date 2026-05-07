module.exports = async function(req, res) {
  // 1. 获取北京时间
  const date = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Shanghai"}));
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const todayStr = `${month}-${day}`;
  const hour = date.getHours(); // 获取当前是几点

  // 【架构师调试后门】判断是否是手动访问链接强制测试 (浏览器访问 xxx.vercel.app/api?force=1)
  const isForceTest = req.query && req.query.force === '1';
  console.log(`[运行日志] 当前北京时间: ${todayStr} ${hour}点, 是否强制测试: ${isForceTest}`);

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
  if (hour === 10) {
    // 【新增：10点专属测试】只要在 10:00~10:59 期间运行，必定发送这条测试消息
    shouldSend = true;
    textContent = `✅ 【10点连通性测试】\n\n收到这条消息，说明你的企业微信 Webhook 环境变量配置完全没问题！Vercel 云端大脑正常工作！\n(当前北京时间: ${todayStr} ${hour}点)`;
  } else if (!courseName) {
    if (hour === 9 || isForceTest) {
      shouldSend = true;
      textContent = `☕ 早上好！(${todayStr})\n\n今天课表上没有安排课程，好好休息或者自主学习吧！${isForceTest ? '\n(这是一条强制测试消息)' : ''}`;
    } else {
      console.log("[运行日志] 没课，且不在9点，自动保持安静。");
      return res.status(200).json({ message: "今天没课，下午/晚上已自动保持安静。" });
    }
  } else {
    const info = coursesInfo[courseName];
    const startHour = parseInt(info.time.split(":")[0], 10);

    if (hour === 9 || isForceTest) {
      shouldSend = true;
    } else if (hour === 14 && startHour >= 12 && startHour < 18) {
      shouldSend = true;
    } else if (hour === 18 && startHour >= 18) {
      shouldSend = true;
    } else {
      console.log(`[运行日志] 当前时间(${hour}点)不满足有课时的推送条件。`);
      return res.status(200).json({ message: "当前时间与上课时间不匹配，无需重复推送此课程。" });
    }

    if (shouldSend) {
      textContent = `📚 今日上课提醒 (${todayStr})\n\n` +
                    `📖 课程：${courseName}\n` +
                    `👨‍🏫 教师：${info.teacher}\n` +
                    `⏰ 时间：${info.time}\n` +
                    `📍 教室：${info.room}\n` +
                    `🔗 直播：${info.link}` + 
                    (isForceTest ? '\n(这是一条强制测试消息)' : '');
    }
  }
  // --- 逻辑判断结束 ---

  // 读取 Vercel 中的环境变量
  const WEBHOOK_URL = process.env.WX_WEBHOOK_URL; 
  
  if (!WEBHOOK_URL) {
    console.error("[运行日志] 严重错误：未读取到环境变量 WX_WEBHOOK_URL");
    return res.status(500).json({ error: "环境变量未配置。请检查 Vercel 的 Environment Variables，并确保配置后进行了 Redeploy(重新部署)！" });
  }

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
    console.log("[运行日志] 发送成功，企业微信返回值:", result);
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("[运行日志] 请求报错:", error.message);
    res.status(500).json({ error: error.message });
  }
};
