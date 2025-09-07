import { Outlet, useNavigate } from "react-router-dom";
import ChatIcon from "../components/ChatIcon";

export default function ProtectedLayout() {
  const navigate = useNavigate();

  return (
    <>
      {/* Konvert faqat shu layout ichida bo‘lgan sahifalarda chiqadi */}
      <ChatIcon onClick={() => navigate("/chats")} />
      <Outlet />
    </>
  );
}