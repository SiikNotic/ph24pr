import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapHelpArticle } from '@/lib/mappers'

export function useHelpArticles() {
  return useQuery({
    queryKey: ['help_articles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('help_articles').select('*').order('category')
      if (error) throw error
      return data.map(mapHelpArticle)
    },
  })
}
