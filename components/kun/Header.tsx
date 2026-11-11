interface Props {
  name: string
  description?: string
  endContent?: React.ReactNode
  headerEndContent?: React.ReactNode
}

export const KunHeader = ({
  name,
  description,
  endContent,
  headerEndContent
}: Props) => {
  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="wrap-break-word text-2xl font-medium">
              <span>{name}</span>
            </h1>
            {description && (
              <p className="whitespace-pre-wrap wrap-break-word text-default-500">
                {description}
              </p>
            )}
          </div>
          {headerEndContent && (
            <div className="shrink-0">{headerEndContent}</div>
          )}
        </div>
        {endContent}
      </div>
    </>
  )
}
