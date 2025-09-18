'use client'

import { addToast, Button } from "@heroui/react";


export default function Home() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center mx-24 p-10">
      Home Page
      <Button
        color="primary"
        onPress={() => {
          addToast({
            title: '你好啊',
            color: 'primary'
          })
        }}
      >
        Click
      </Button>
      {
        Array.from({ length: 20 }).map((_, index) => {
          return <div key={index}>
            {index + 1} Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut repellat fugit recusandae ab, corporis quis, adipisci maiores quo, ea dolores sint mollitia debitis illum unde rerum esse labore minus. Recusandae?
          </div>
        })
      }
    </div>
  );
}
