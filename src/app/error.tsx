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
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
      <div className="px-2">
        <Alert status="danger">
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error.message}</Alert.Description>
        </Alert>
      </div>
      <Button onPress={() => reset()} variant="danger">
        Try again
      </Button>
    </div>
  )
}
