import { auth } from "@/auth";
import { BoardLoader } from "@/components/board-loader";
import { User } from "next-auth";

export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const session = await auth();

  // The Page remains a Server Component to handle authentication securely.
  if (!session?.user?.id) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        <p className="text-2xl font-semibold">Access Denied. Please sign in.</p>
      </div>
    );
  }

  // We pass control to a Client Component to handle the dynamic import.
  return <BoardLoader boardId={params.boardId} user={session.user as User & { id: string }} />;
}