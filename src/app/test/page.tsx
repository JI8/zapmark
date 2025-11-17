'use client';

import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';

export default function TestPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRunTest = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to run the test.',
      });
      return;
    }
    if (!firestore || !storage) {
        toast({
            variant: 'destructive',
            title: 'Firebase Service Error',
            description: 'Firestore or Storage service is not available. Check FirebaseProvider.',
          });
          return;
    }

    setIsLoading(true);
    toast({ title: 'Test Initiated', description: 'Attempting to write to Firestore and Storage...' });

    try {
      // 1. Firestore Write Test
      const testDocId = `test_${Date.now()}`;
      const testDocRef = doc(firestore, 'users', user.uid, 'tests', testDocId);
      const firestoreData = {
        id: testDocId,
        userId: user.uid,
        message: 'This is a successful Firestore write test.',
        createdAt: serverTimestamp(),
      };

      await setDoc(testDocRef, firestoreData);
      toast({
        title: 'Firestore Write Successful!',
        description: `Document created at: /users/${user.uid}/tests/${testDocId}`,
      });

      // 2. Storage Upload Test
      const storageRef = ref(storage, `users/${user.uid}/tests/test-file-${Date.now()}.txt`);
      const fileContent = `This is a successful Firebase Storage upload test generated at ${new Date().toISOString()} by user ${user.uid}.`;

      // Corrected call to uploadString with 3 arguments
      await uploadString(storageRef, fileContent, 'raw');
      toast({
        title: 'Storage Upload Successful!',
        description: `File uploaded to path: ${storageRef.fullPath}`,
      });

    } catch (error) {
      console.error('Test Failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: `Could not complete the operation. Reason: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex justify-center items-center h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Backend Integration Test</CardTitle>
            <CardDescription>
              This page provides a simple test to verify that the application can write to both Firestore and Firebase Storage. It does not use any AI tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to perform the following actions:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Create a new document in Firestore at `/users/{'{your-id}'}/tests/{'{test-id}'}`.</li>
                <li>Upload a new text file to Firebase Storage at `users/{'{your-id}'}/tests/test-file.txt`.</li>
              </ul>
              <p className="text-sm font-medium">
                {isUserLoading ? 'Checking authentication...' : (user ? `Signed in as: ${user.email}` : 'Please sign in to run the test.')}
              </p>
              <Button onClick={handleRunTest} disabled={isLoading || isUserLoading || !user}>
                {isLoading && <Loader2 className="animate-spin mr-2" />}
                Run Write Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
