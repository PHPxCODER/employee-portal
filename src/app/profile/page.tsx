import authOptions from "@/auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/ui/SignoutButton"; 


const ProfilePage = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="bg-white dark:bg-black rounded-2xl shadow-lg p-8 max-w-md w-full border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
          User Profile
        </h1>

        <div className="flex justify-center mb-6">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={`${session.user.name}'s Profile Picture`}
              className="w-36 h-36 rounded-full object-cover border-4 border-black dark:border-white"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-black dark:bg-black flex items-center justify-center text-3xl text-white">
              No Image
            </div>
          )}
        </div>

        <div className="space-y-3 text-black dark:text-white">
          <p>
            <strong>Name:</strong> {session.user.name}
          </p>
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          {session.user.username && (
            <p>
              <strong>Username:</strong> {session.user.username}
            </p>
          )}
          {session.user.groups && session.user.groups.length > 0 && (
            <p>
              <strong>Groups:</strong>{" "}
              {session.user.groups
                .map((group) => {
                  const match = group.match(/^CN=([^,]+)/);
                  return match ? match[1] : group;
                })
                .join(", ")}
            </p>
          )}
          <SignOutButton/>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;