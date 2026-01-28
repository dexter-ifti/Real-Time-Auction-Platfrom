import { formatDistanceToNow, formatDistance } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatTimeRemaining = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;

  if (diff <= 0) {
    return 'Ended';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getTimeRemainingColor = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = (end - now) / 1000;

  if (diff <= 0) {
    return 'text-gray-500';
  } else if (diff < 60) {
    return 'text-red-600 font-bold animate-pulse';
  } else if (diff < 300) {
    return 'text-orange-600 font-semibold';
  } else {
    return 'text-green-600';
  }
};

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const generateUserId = () => {
  return `user_${Math.random().toString(36).substr(2, 9)}`;
};

export const getUserName = () => {
  const storedName = localStorage.getItem('userName');
  if (storedName) return storedName;

  const adjectives = ['Quick', 'Silent', 'Bold', 'Wise', 'Swift', 'Bright', 'Lucky', 'Sharp'];
  const nouns = ['Bidder', 'Buyer', 'Trader', 'Hunter', 'Collector', 'Eagle', 'Fox', 'Wolf'];
  
  const userName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
  
  localStorage.setItem('userName', userName);
  return userName;
};

export const saveUserCredentials = (userId, userName) => {
  localStorage.setItem('userId', userId);
  localStorage.setItem('userName', userName);
};

export const getUserCredentials = () => {
  let userId = localStorage.getItem('userId');
  let userName = localStorage.getItem('userName');

  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('userId', userId);
  }

  if (!userName) {
    userName = getUserName();
  }

  return { userId, userName };
};