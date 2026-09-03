-- Needed for the chat page's "Clear conversation" action.
create policy "Users can delete own chat messages"
  on public.chat_messages for delete
  using ((select auth.uid()) = user_id);
