import React from "react";
import "./MessageIcon.css";

const MessageIcon = ({ unreadCount = 0 }) => {
  return (
    <div className="message-icon-wrapper">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        className="message-icon"
        viewBox="0 0 24 24"
      >
        <path d="M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16l-4-4H4a2 2 0 0 1-2-2V4z" />
      </svg>
      {unreadCount > 0 && (
        <span className="message-badge">{unreadCount}</span>
      )}
    </div>
  );
};

export default MessageIcon;