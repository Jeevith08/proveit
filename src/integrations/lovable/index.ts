// Direct Supabase OAuth — no Lovable Cloud proxy needed.
import { supabase } from '../supabase/client';

type Provider = 'google' | 'github' | 'azure' | 'facebook' | 'twitter' | 'discord';

type SignInOptions = {
  redirect_uri?: string;
  scopes?: string;
  queryParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: Provider, opts?: SignInOptions) => {
      const options: {
        redirectTo?: string;
        scopes?: string;
        queryParams?: Record<string, string>;
      } = {};
      if (opts?.redirect_uri !== undefined) options.redirectTo = opts.redirect_uri;
      if (opts?.scopes !== undefined) options.scopes = opts.scopes;
      if (opts?.queryParams !== undefined) options.queryParams = opts.queryParams;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        return { error };
      }

      return { redirected: !!data.url, url: data.url };
    },
  },
};
