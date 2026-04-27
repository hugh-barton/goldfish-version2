export default async function handler(req, res) {
  console.log('=== ENV TEST ===');
  console.log('All environment variables:', Object.keys(process.env));
  
  // Test specific variables
  const testVars = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY ? '[PRESENT]' : '[MISSING]',
    'NODE_ENV': process.env.NODE_ENV,
    'VERCEL_URL': process.env.VERCEL_URL || '[MISSING]',
    'VERCEL_ENV': process.env.VERCEL_ENV || '[MISSING]',
  };
  
  console.log('Test variables:', testVars);
  
  res.status(200).json({
    message: 'Environment test',
    environment: process.env.NODE_ENV,
    vercelEnvironment: process.env.VERCEL_ENV,
    openaiKeyStatus: process.env.OPENAI_API_KEY ? 'PRESENT' : 'MISSING',
    availableVars: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASSWORD') && !key.includes('KEY')
    )
  });
}