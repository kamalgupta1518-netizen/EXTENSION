/**
 * Antigravity New Tab - Background Service Worker (Manifest V3)
 * Handles Chrome alarms, persistent scheduled reminders with custom days,
 * audio chime broadcasts, desktop notifications with Stop & Snooze action buttons.
 */

// Initialize default state on extension install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    'boards',
    'reminders',
    'timerSettings',
    'antigravityEnabled',
    'customDateSettings',
    'weeklyFocusData',
    'backgroundSettings'
  ]);
  
  const defaults = {};

  if (!data.boards) {
    defaults.boards = [
      {
        id: 'board-quick-links',
        title: 'Quick Links',
        type: 'bookmark',
        items: [
          { id: 'item-gemini', title: 'Gemini', url: 'https://gemini.google.com', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
          { id: 'item-1', title: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon.svg' },
          { id: 'item-3', title: 'Reddit', url: 'https://reddit.com', icon: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png' },
          { id: 'item-4', title: 'ChatGPT', url: 'https://chatgpt.com', icon: 'https://chatgpt.com/favicon.ico' }
        ]
      },
      {
        id: 'board-work',
        title: 'Work & Projects',
        type: 'task',
        items: [
          { id: 'item-5', title: 'Review pull requests', completed: false, tag: 'urgent' },
          { id: 'item-6', title: 'Prepare weekly sprint report', completed: true, tag: 'work' },
          { id: 'item-7', title: 'Refactor UI components', completed: false, tag: 'dev' }
        ]
      },
      {
        id: 'board-personal',
        title: 'Personal Goals',
        type: 'task',
        items: [
          { id: 'item-8', title: 'Read 20 pages of Sci-Fi book', completed: false, tag: 'daily' },
          { id: 'item-9', title: '30 min workout / stretching', completed: false, tag: 'health' }
        ]
      }
    ];
  }

  if (!data.reminders) {
    defaults.reminders = [
      {
        id: 'rem-water',
        title: 'Stay Hydrated',
        message: 'Time to drink a fresh glass of water 💧',
        time: '14:00',
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6] // Sun, Mon, Tue, Wed, Thu, Fri, Sat
      }
    ];
  }

  if (!data.timerSettings) {
    defaults.timerSettings = {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreak: false
    };
  }

  if (!data.customDateSettings) {
    defaults.customDateSettings = {
      userName: 'Explorer',
      clockFormat: '24h',
      showSeconds: true,
      dateFormat: 'full',
      customGreeting: '',
      countdownEventName: '',
      countdownEventDate: ''
    };
  }

  if (!data.weeklyFocusData) {
    defaults.weeklyFocusData = {
      targetHours: 20,
      weekStart: 'mon',
      dailyMinutes: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      lastWeekNumber: getISOWeekNumber(new Date())
    };
  }

  if (!data.backgroundSettings) {
    defaults.backgroundSettings = {
      type: 'live',
      liveMode: 'antigravity',
      photoUrl: '',
      photoDataUrl: '',
      presetId: 'nebula',
      dimOpacity: 0,
      blurAmount: 0,
      videoAudioEnabled: false,
      videoVolume: 80
    };
  }

  if (data.antigravityEnabled === undefined) {
    defaults.antigravityEnabled = true;
  }

  if (Object.keys(defaults).length > 0) {
    await chrome.storage.local.set(defaults);
  }

  syncAllAlarms();
});

function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// Synchronize all alarms with scheduled reminders
async function syncAllAlarms() {
  await chrome.alarms.clearAll();
  const { reminders } = await chrome.storage.local.get('reminders');
  if (!reminders || !Array.isArray(reminders)) return;

  const now = new Date();

  reminders.forEach((rem) => {
    if (!rem.enabled || !rem.time) return;
    
    const [hours, minutes] = rem.time.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const delayInMinutes = Math.max(0.05, (target.getTime() - now.getTime()) / 60000);

    chrome.alarms.create(`reminder-${rem.id}`, {
      delayInMinutes: delayInMinutes,
      periodInMinutes: 1440 // Repeat every 24 hours
    });
  });
}

// Broadcast message to all open extension tabs
function broadcastToTabs(msg) {
  chrome.tabs.query({}, (tabs) => {
    (tabs || []).forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      }
    });
  });
}

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder-')) {
    const reminderId = alarm.name.replace('reminder-', '');
    const { reminders } = await chrome.storage.local.get('reminders');
    const reminder = (reminders || []).find((r) => r.id === reminderId);

    if (reminder && reminder.enabled) {
      const todayDay = new Date().getDay();
      const activeDays = Array.isArray(reminder.days) ? reminder.days : [0, 1, 2, 3, 4, 5, 6];

      if (activeDays.includes(todayDay)) {
        // 1. Broadcast to tab for audible ringing sound & stop UI
        broadcastToTabs({
          type: 'TRIGGER_ALARM_RING',
          title: reminder.title || 'Scheduled Reminder',
          message: reminder.message || 'Time is up for your scheduled alert.',
          time: reminder.time || 'Now',
          id: reminder.id
        });

        // 2. Desktop notification with action buttons
        chrome.notifications.create(`alarm-notif-${reminder.id}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: `⏰ ${reminder.title || 'Antigravity Alarm'}`,
          message: `${reminder.message || 'Your scheduled alarm is ringing!'}\n(Time: ${reminder.time})`,
          priority: 2,
          requireInteraction: true,
          buttons: [
            { title: '⏹️ Stop Alarm' },
            { title: '💤 Snooze 5 Min' }
          ]
        });
      }
    }
  } else if (alarm.name === 'pomodoro-timer') {
    broadcastToTabs({
      type: 'TRIGGER_ALARM_RING',
      title: '🍅 Focus Session Complete!',
      message: 'Great work! Time for a refreshing break and stretch.',
      time: 'Focus Done',
      id: 'pomodoro'
    });

    chrome.notifications.create(`alarm-notif-pomodoro-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🍅 Focus Session Complete!',
      message: 'Great job! Time to take a mindful break and stretch.',
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: '⏹️ Stop Alarm' },
        { title: '☕ Start Break' }
      ]
    });
  } else if (alarm.name.startsWith('snooze-')) {
    broadcastToTabs({
      type: 'TRIGGER_ALARM_RING',
      title: '⏰ Snoozed Alarm Ringing!',
      message: 'Your 5-minute snooze is up.',
      time: 'Snooze Up',
      id: 'snooze'
    });

    chrome.notifications.create(`alarm-notif-snooze-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '⏰ Snoozed Alarm Alert',
      message: 'Your 5-minute snooze is up!',
      priority: 2,
      requireInteraction: true,
      buttons: [
        { title: '⏹️ Stop Alarm' }
      ]
    });
  }
});

// Handle notification action buttons
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.notifications.clear(notificationId);

  if (buttonIndex === 0) {
    // Stop Alarm Sound across all tabs
    broadcastToTabs({ type: 'STOP_ALARM_RING' });
  } else if (buttonIndex === 1) {
    // Snooze 5 min
    broadcastToTabs({ type: 'STOP_ALARM_RING' });
    chrome.alarms.create(`snooze-${Date.now()}`, { delayInMinutes: 5 });
  }
});

chrome.notifications.onClosed.addListener(() => {
  broadcastToTabs({ type: 'STOP_ALARM_RING' });
});

// Listen for messages from frontend scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_ALARMS') {
    syncAllAlarms().then(() => sendResponse({ status: 'ok' }));
    return true;
  } else if (message.type === 'START_POMODORO_ALARM') {
    chrome.alarms.create('pomodoro-timer', {
      delayInMinutes: message.minutes
    });
    sendResponse({ status: 'alarm_set' });
  } else if (message.type === 'CANCEL_POMODORO_ALARM') {
    chrome.alarms.clear('pomodoro-timer');
    sendResponse({ status: 'alarm_cleared' });
  } else if (message.type === 'STOP_ALARM_RING') {
    broadcastToTabs({ type: 'STOP_ALARM_RING' });
    if (chrome.notifications && chrome.notifications.getAll) {
      chrome.notifications.getAll((notifications) => {
        if (notifications) {
          Object.keys(notifications).forEach((notifId) => {
            if (notifId.startsWith('alarm-notif-')) {
              chrome.notifications.clear(notifId);
            }
          });
        }
      });
    }
    sendResponse({ status: 'stopped' });
    return true;
  } else if (message.type === 'SNOOZE_ALARM') {
    broadcastToTabs({ type: 'STOP_ALARM_RING' });
    chrome.alarms.create(`snooze-${Date.now()}`, { delayInMinutes: message.minutes || 5 });
    sendResponse({ status: 'snoozed' });
    return true;
  }
});
