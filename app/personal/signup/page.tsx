import type { Metadata } from 'next';
import { AuthScreen } from '../../../components/public/auth-screen';
export const metadata: Metadata = {title:'Personal signup — SilentEcho'};
export default function Page() {return <AuthScreen workspace="personal" register={true}/>;}
