import { useEffect } from "react";
import { registerOrGetUser } from "../utils/user";

export default function UserBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function bootstrapUser() {
      try {
        const user = await registerOrGetUser();

        if (!cancelled) {
          console.log(
            "MAUSAM USER READY:",
            user.id,
            user.device_id
          );
        }
      } catch (error) {
        console.error(
          "MAUSAM USER BOOTSTRAP FAILED:",
          error
        );
      }
    }

    bootstrapUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
