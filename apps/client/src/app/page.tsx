import { auth, signIn, signOut } from "@/auth";
import { CreateBoardForm } from "@/components/create-board-form";

// Simple button components for signing in
function SignIn({ provider, ...props }: { provider?: string; [key: string]: any }) {
  // This safely handles the case where provider might be undefined.
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
      <button {...props}>Sign Out</button>
    </form>
  );
}

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Synapse Whiteboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your real-time collaborative canvas.
          </p>
        </div>

        {user ? (
          <div className="text-center">
            <p className="text-lg">Welcome, {user.name || "User"}!</p>
            <p className="text-sm text-gray-500 mb-4">({user.email})</p>
            <CreateBoardForm />
            <SignOut className="w-full px-4 py-2 mt-4 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">Please sign in to continue</p>
            <SignIn provider="google" className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" />
            <SignIn provider="github" className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900" />
          </div>
        )}
      </div>
    </main>
  );
}