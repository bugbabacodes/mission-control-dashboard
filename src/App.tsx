import { useState, useEffect } from 'react'
import './index.css'

interface Agent {
  id: string
  name: string
  role: string
  status: 'running' | 'stopped' | 'error' | 'idle'
  lastActivity: string
  tasks: number
}

interface Activity {
  id: string
  agent: string
  action: string
  timestamp: string
  status: 'success' | 'error' | 'pending'
}

interface WebSocketMessage {
  type: string
  data?: any
  logs?: string[]
  message?: string
}

function StatusBadge({ status }: { status: Agent['status'] }) {
  const colors = {
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
    idle: 'bg-yellow-500',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colors[status]}`}>
      {status}
    </span>
  )
}

function AgentCard({ agent, onStart, onStop, onLogs }: { 
  agent: Agent
  onStart: (id: string) => void
  onStop: (id: string) => void
  onLogs: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{agent.name}</h3>
        <StatusBadge status={agent.status} />
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{agent.role}</p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2">
        <span className="text-gray-500">
          Last: {agent.lastActivity ? new Date(agent.lastActivity).toLocaleTimeString() : 'Never'}
        </span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full w-fit">{agent.tasks} tasks</span>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button 
          onClick={() => onStart(agent.id)}
          disabled={agent.status === 'running'}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Start
        </button>
        <button 
          onClick={() => onStop(agent.id)}
          disabled={agent.status !== 'running'}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Stop
        </button>
        <button 
          onClick={() => onLogs(agent.id)}
          className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-300 transition-colors"
        >
          Logs
        </button>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const statusColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    pending: 'text-yellow-600',
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-0 gap-1 sm:gap-0">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <span className="font-medium text-gray-900 text-sm">{activity.agent}</span>
        <span className="text-gray-600 mx-0 sm:mx-2 hidden sm:inline">—</span>
        <span className="text-gray-700 text-sm">{activity.action}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm ${statusColors[activity.status]}`}>●</span>
        <span className="text-xs sm:text-sm text-gray-500">{new Date(activity.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  )
}

function LogsModal({ agentId, logs, onClose }: { 
  agentId: string | null
  logs: string[]
  onClose: () => void
}) {
  if (!agentId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold">Logs for {agentId}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {logs.length === 0 ? (
            <p className="text-gray-500">Loading logs...</p>
          ) : (
            <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
              {logs.join('\n')}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [logsAgentId, setLogsAgentId] = useState<string | null>(null)
  const [agentLogs, setAgentLogs] = useState<string[]>([])

  // Get WebSocket URL from environment variable or fallback
  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080'

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket(WS_URL)
    
    websocket.onopen = () => {
      setConnectionStatus('connected')
      console.log('Connected to agent orchestrator')
    }
    
    websocket.onclose = () => {
      setConnectionStatus('disconnected')
      console.log('Disconnected from agent orchestrator')
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        setConnectionStatus('connecting')
      }, 5000)
    }
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('disconnected')
    }
    
    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    setWs(websocket)
    
    return () => {
      websocket.close()
    }
  }, [WS_URL])

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'initial_state':
        setAgents(message.data.agents)
        break
        
      case 'agent_status_update':
        setAgents(prev => {
          const updated = prev.map(agent => 
            agent.id === message.data.id ? message.data : agent
          )
          // If agent doesn't exist, add it
          if (!updated.find(a => a.id === message.data.id)) {
            updated.push(message.data)
          }
          return updated
        })
        break
        
      case 'activity_update':
        setActivities(prev => {
          const updated = [message.data, ...prev]
          // Keep only last 20 activities
          return updated.slice(0, 20)
        })
        break
        
      case 'agent_logs':
        setAgentLogs(message.logs || [])
        break
        
      case 'error':
        console.error('Server error:', message.message)
        break
    }
  }

  // Control functions
  const startAgent = (agentId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'start_agent',
        agentId
      }))
    }
  }

  const stopAgent = (agentId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'stop_agent',
        agentId
      }))
    }
  }

  const getLogs = (agentId: string) => {
    setLogsAgentId(agentId)
    setAgentLogs([])
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'get_logs',
        agentId
      }))
    }
  }

  const runningCount = agents.filter(a => a.status === 'running').length
  const totalTasks = agents.reduce((sum, a) => sum + a.tasks, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mission Control</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Monitor and control your AI agents</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-green-600">{runningCount}</p>
                <p className="text-xs text-gray-500">Running</p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalTasks}</p>
                <p className="text-xs text-gray-500">Tasks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Agents</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{agents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Active</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{runningCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Pending Tasks</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalTasks}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">System Status</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {connectionStatus === 'connected' ? 'Healthy' : 'Disconnected'}
            </p>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onStart={startAgent}
                onStop={stopAgent}
                onLogs={getLogs}
              />
            ))}
            {agents.length === 0 && (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No agents connected</p>
                <p className="text-sm text-gray-400 mt-1">Waiting for agents to register...</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Recent Activity</h2>
          <div>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No recent activity</p>
            ) : (
              activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Logs Modal */}
      <LogsModal 
        agentId={logsAgentId}
        logs={agentLogs}
        onClose={() => setLogsAgentId(null)}
      />
    </div>
  )
}

export default App
