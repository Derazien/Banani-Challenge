import React, { ReactNode } from "react";

// Import custom icons from Figma
import { BookmarkIcon } from "./icons/BookmarkIcon";
import { ChatBubbleIcon } from "./icons/ChatBubbleIcon";
import { MoreHorizIcon } from "./icons/MoreHorizIcon";
import { DnsIcon } from "./icons/DnsIcon";
import { InboxIcon } from "./icons/InboxIcon";
import { AccountBalanceIcon } from "./icons/AccountBalanceIcon";
import { AnalyticsIcon } from "./icons/AnalyticsIcon";
import { DraftIcon } from "./icons/DraftIcon";
import { ArrowUpIcon } from "./icons/ArrowUpIcon";
import { DeleteIcon } from "./icons/DeleteIcon";

// Default fallback icon
import { FileIcon } from "@radix-ui/react-icons";

// const iconClass = "text-white"; // Removed for reversion

const iconMap: Record<string, ReactNode> = {
  bookmark: <BookmarkIcon />,
  chat: <ChatBubbleIcon />,
  menu: <MoreHorizIcon />,
  dns: <DnsIcon />,
  inbox: <InboxIcon />,
  account_balance: <AccountBalanceIcon />,
  analytics: <AnalyticsIcon />,
  draft: <DraftIcon />,
  chart: <AnalyticsIcon />,
  delete: <DeleteIcon />,
  edit: <FileIcon />,
  file: <FileIcon />,
  calendar: <FileIcon />,
  person: <FileIcon />,
  settings: <FileIcon />,
  star: <FileIcon />,
  mail: <FileIcon />,
  lock: <FileIcon />,
  globe: <FileIcon />,
  share: <ArrowUpIcon />,
};

export function getIcon(name: string): ReactNode {
  // Add bookmarkFilled icon if it doesn't exist
  if (name === 'bookmarkFilled') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
      </svg>
    );
  }
  
  // Add bookmark icon if it doesn't exist
  if (name === 'bookmark') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    );
  }
  
  // Check if the edit icon exists, if not add it
  if (name === 'edit') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    );
  }
  
  // Check if the view icon exists, if not add it
  if (name === 'view') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    );
  }
  
  // Check if the hourglass icon exists, if not add it
  if (name === 'hourglass') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm4 3a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  }
  
  // Add error icon
  if (name === 'error') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  }
  
  // Add loading spinner icon
  if (name === 'loading') {
    return (
      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  }
  
  return iconMap[name] || <FileIcon />;
} 