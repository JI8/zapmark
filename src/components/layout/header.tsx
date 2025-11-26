'use client';

import Link from 'next/link';
import { User, LogIn, LogOut, X } from 'lucide-react';
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
import { HEADER_STYLES } from '@/components/layout/header-constants';
import { cn } from '@/lib/utils';

type TokenData = {
  userId: string;
  monthlyAllotment: number;
  tokensUsed: number;
  lastRefillDate: any;
};

type Logo = {
  id: string;
  url: string;
  isUnsaved?: boolean;
  logoGridId?: string;
  tileIndex?: number;
};

interface HeaderProps {
  isGenerating?: boolean;
  isDone?: boolean;
  previewImage?: string | null;
  onViewResults?: () => void;
  selectedLogos?: Logo[];
  onClearSelection?: () => void;
}

export default function Header({ isGenerating, isDone, previewImage, onViewResults, selectedLogos = [], onClearSelection }: HeaderProps) {
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
    // Force account selection every time
    provider.setCustomParameters({
      prompt: 'select_account'
    });
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
    <header className={HEADER_STYLES.wrapper}>
      <div className={cn("flex", HEADER_STYLES.height)}>
        {/* Left sidebar header section */}
        <div className={cn(HEADER_STYLES.appSidebarWidth, "flex items-center px-4 md:px-6 md:border-r")}>
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon className={HEADER_STYLES.logo} />
            <span className={HEADER_STYLES.brandText}>Zapmark</span>
          </Link>

          {/* Mobile nav */}
          <div className="ml-auto md:hidden">
            <nav className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-200/50 mr-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{remainingTokens}</span>
                </div>
              )}
              {isUserLoading ? (
                <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer h-9 w-9">
                      <AvatarImage src={user.photoURL || ''} alt="User" />
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
        <div className="hidden md:flex flex-1 items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Loader Section */}
          <div className="flex items-center">
            {selectedLogos.length > 0 ? (
              <div className="flex items-center gap-3 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-3 pl-1">
                    {selectedLogos.map((logo, idx) => (
                      <div
                        key={logo.id}
                        className="relative group/img shrink-0 transition-transform hover:z-10 hover:scale-110"
                        style={{ zIndex: idx }}
                      >
                        <div className="w-8 h-8 rounded-lg border-2 border-background overflow-hidden bg-muted/20 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logo.url}
                            alt="Selected"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-muted-foreground font-medium">
                    {selectedLogos.length} selected
                  </span>
                </div>
                <div className="h-4 w-px bg-border mx-2" />
                <button
                  onClick={onClearSelection}
                  className="p-1 hover:bg-accent rounded-full transition-colors"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : isGenerating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : isDone && previewImage ? (
              <button
                onClick={onViewResults}
                className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors animate-in fade-in slide-in-from-left-2 duration-300 group"
              >
                <div className="relative h-6 w-6 rounded overflow-hidden border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewImage} alt="Generated" className="h-full w-full object-cover" />
                </div>
                <span>Done</span>
                <span className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">(Click to view)</span>
              </button>
            ) : null}
          </div>
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
