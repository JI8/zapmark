'use client';

import Link from 'next/link';
import { User, LogIn, LogOut } from 'lucide-react';
import { LogoIcon } from '@/components/icons/logo-icon';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Coins } from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type TokenData = {
  userId: string;
  monthlyAllotment: number;
  tokensUsed: number;
  lastRefillDate: any;
};

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch user document which contains token data
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isLoadingTokens } = useDoc<any>(userDocRef);
  
  const remainingTokens = userData?.remainingTokens || 0;



  const handleLogin = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      const userDocRef = doc(firestore, 'users', gUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: gUser.uid,
          email: gUser.email,
          name: gUser.displayName,
          creationDate: serverTimestamp(),
          monthlyTokenAllotment: 100,
          remainingTokens: 100,
        });
        
        toast({
          title: 'Welcome!',
          description: 'Your account and initial tokens have been set up.',
        });
      } else {
        toast({
          title: 'Welcome Back!',
          description: 'You have successfully signed in.',
        });
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: `Could not sign you in. Reason: ${errorMessage}`,
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an error signing you out.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16">
        {/* Left sidebar header section */}
        <div className="w-full md:w-[440px] flex items-center px-4 md:px-6 md:border-r">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon className="h-7 md:h-8 w-7 md:w-8" />
            <span className="font-bold text-lg md:text-xl font-headline tracking-tight">Zapmark AI</span>
          </Link>
          
          {/* Mobile nav */}
          <div className="ml-auto md:hidden">
            <nav className="flex items-center gap-2">
              {isUserLoading ? (
                 <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer h-9 w-9">
                      {user.photoURL && <AvatarImage src={user.photoURL} alt="User" />}
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleLogin} size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </nav>
          </div>
        </div>
        
        {/* Desktop right content header section */}
        <div className="hidden md:flex flex-1 items-center justify-end px-6">
          <nav className="flex items-center gap-4">
            {isUserLoading ? (
               <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                {isLoadingTokens ? (
                  <div className="h-8 w-16 bg-muted rounded-full animate-pulse" />
                ) : userData ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">
                      {remainingTokens}
                    </span>
                  </div>
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer h-9 w-9">
                      {user.photoURL && <AvatarImage src={user.photoURL} alt="User" />}
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button onClick={handleLogin}>
                <LogIn className="mr-2 h-4 w-4" />
                Login with Google
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
