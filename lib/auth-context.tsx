import { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    isLoadingUser: boolean;
    signUp: (email: string, password: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, SetUser] = useState<Models.Preferences | null>(null);
    const [isLoadingUser, SetIsLoadingUser] = useState<boolean>(true);

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await account.get();
                setIsAuth(true);
            } catch (e) {
                setIsAuth(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const getUser = async () => {
        try {
            const session = await account.get();
            SetUser(session)
        } catch (error) {
            SetUser(null);
        } finally {
            SetIsLoadingUser(false)
        }
    }

    const signUp = async (email: string, password: string) => {
        try {
            await account.create(ID.unique(), email, password);
            await signIn(email, password);
            return null;
        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "An error occurred during signup";
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            await account.createEmailPasswordSession({ email, password });
            const session = await account.get()
            SetUser(session);
            return null;

        } catch (error) {
            if (error instanceof Error) {
                return error.message;
            }
            return "An error occurred during sign in";
        }
    }

    const signOut = async () => {
        try {
            await account.deleteSession("current");
            SetUser(null);
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, isLoadingUser, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be inside of the AuthProvider")
    }

    return context;
}