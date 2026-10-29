import type { Metadata } from 'next';
import { AuthScreen } from '../../../components/public/auth-screen';
export const metadata: Metadata = {title:'Organisation sign in — SilentEcho'};
export default function Page() {return <AuthScreen workspace="organisation" register={false}/>;}
