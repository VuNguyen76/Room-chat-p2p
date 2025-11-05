import type { ReactNode } from 'react'

interface MainLayoutProps {
  header: ReactNode
  content: ReactNode
  bottomControls: ReactNode
  chatPanel?: ReactNode
}

export function MainLayout({
  header,
  content,
  bottomControls,
  chatPanel,
}: MainLayoutProps) {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div className="flex-shrink-0 w-full">{header}</div>

      <main className="flex-1 w-full overflow-hidden min-h-0">
        <div className="h-full flex flex-row">
          <div className="flex-1 overflow-hidden min-w-0">
            {content}
          </div>

          {chatPanel && (
            <aside className="chat-panel-fixed flex-shrink-0 border-l border-border bg-background">
              {chatPanel}
            </aside>
          )}
        </div>
      </main>

      <div className="flex-shrink-0 w-full">{bottomControls}</div>
    </div>
  )
}

