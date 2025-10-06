'use client'

import { Alert, Button } from "@heroui/react";
import { useEffect } from "react";

export default function Error({
  error,
  reset
}: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.log('error', error)
  }, [error])

  return (
    <div className="h-screen w-screen flex flex-col gap-4 items-center justify-center">
      <div className="px-2">
        <Alert title="Error" description={error.message} color="danger"></Alert>
      </div>
      <Button onPress={() => reset()} color="danger">
        Try again
      </Button>
    </div>
  )
}