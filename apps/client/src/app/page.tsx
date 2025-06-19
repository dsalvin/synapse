import { auth, signIn, signOut } from "@/auth";
import { CreateBoardForm } from "@/components/create-board-form";
import { BoardList } from "@/components/board-list";
import { getBoardsForUser } from "@synapse/firebase-admin"; // Import the new, correctly named function
import type { Board } from "@/types/board.d";

function SignIn({ provider, ...props }: { provider?: string; [key: string]: any }) {
  const buttonText = provider
    ? `Sign In with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
    : "Sign In";

  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider);
      }}
    >
      <button {...props}>{buttonText}</button>
    </form>
  );
}

function SignOut(props: any) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <div className="flex justify-end mt-4">
          <button {...props}>Sign Out</button>
      </div>
    </form>
  );
}

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  
  let boards: Board[] = [];

  if (user?.id) {
    // Call the new, correct function
    const userBoards = await getBoardsForUser(user.id);
    boards = userBoards as Board[];
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        
        {user ? (
          <div>
            <div className="flex justify-between items-center">
              <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Welcome, {user.name || "User"}!
                </h1>
                <p className="text-sm text-gray-600">Your collaborative dashboard.</p>
              </div>
              <SignOut className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700" />
            </div>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a New Board</h2>
              <CreateBoardForm />
            </div>

            <BoardList boards={boards} />

          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Synapse Whiteboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your real-time collaborative canvas.
            </p>
            <div className="space-y-4 mt-8">
              <p className="text-center text-gray-600">Please sign in to continue</p>
              <SignIn provider="google" className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" />
              <SignIn provider="github" className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}