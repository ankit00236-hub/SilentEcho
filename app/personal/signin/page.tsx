import type { Metadata } from 'next';
import { AuthScreen } from '../../../components/public/auth-screen';
export const metadata: Metadata = {title:'Personal sign in — SilentEcho'};
export default function Page() {return <AuthScreen workspace="personal" register={false}/>;}
