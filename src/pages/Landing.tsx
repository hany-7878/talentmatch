import { useState } from "react";
import ImageSection from "../components/ImageSection";
import AuthForm from "../components/AuthForm";

export default function Landing() {
  const [role, setRole] = useState<'seeker' | 'manager' | null>(null);
  const [formType, setFormType] = useState<'login' | 'register'>('register');

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-1/2 h-screen">
        <ImageSection />
      </div>
      <div className="flex flex-col w-full md:w-1/2 items-center justify-center p-8">
        <AuthForm 
  // @ts-ignore
  role={role} 
  // @ts-ignore
  setRole={setRole} 
  type={formType} 
  switchType={() => setFormType(formType === 'login' ? 'register' : 'login')} 
/>
      </div>
    </div>
  );
}
