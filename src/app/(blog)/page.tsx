export default function Home() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center mx-24 p-10">
      Home Page
      {
        Array.from({ length: 20 }).map((_, index) => {
          return <div>
            {index + 1} Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut repellat fugit recusandae ab, corporis quis, adipisci maiores quo, ea dolores sint mollitia debitis illum unde rerum esse labore minus. Recusandae?
          </div>
        })
      }
    </div>
  );
}
