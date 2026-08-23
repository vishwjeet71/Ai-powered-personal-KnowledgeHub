import { useNavigate, Link } from "react-router-dom"

export default function Navigation() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate('/')}>Go to Chat</button>
      <button onClick={() => navigate('/KnowledgeBase')}>Go to Knowledge Base</button>
      <button onClick={() => navigate('/settings')}>Go to Settings</button>
    </div>
  )
}