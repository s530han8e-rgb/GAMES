import path from 'node:path';

export function browserLaunchSpec(platform,url,systemRoot='C:\\Windows'){
 const parsed=new URL(url);
 if(parsed.protocol!=='http:'||parsed.hostname!=='127.0.0.1'||parsed.pathname!=='/'||parsed.search||parsed.hash)throw Error('Invalid local game URL');
 if(platform==='darwin')return {command:'/usr/bin/open',args:[parsed.href],options:{stdio:'ignore'}};
 if(platform==='win32')return {
  command:path.win32.join(systemRoot,'System32','cmd.exe'),
  args:['/d','/s','/c',`start "" "${parsed.href}"`],
  options:{stdio:'ignore',windowsHide:true,windowsVerbatimArguments:true}
 };
 return null;
}
