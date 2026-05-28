-- skipQ — Migration 0013: keep salons.rating + stylists.rating in sync
--
-- When a review lands, the salon's average + count should update so the
-- discovery list reflects it. Same for the stylist if one is named.

create or replace function public.recompute_salon_rating(p_salon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.salons s
     set rating       = coalesce(agg.avg_rating, 0)::numeric(2,1),
         review_count = coalesce(agg.cnt, 0)
    from (
      select avg(rating)::numeric as avg_rating, count(*) as cnt
      from public.reviews
      where salon_id = p_salon_id
    ) agg
   where s.id = p_salon_id;
$$;

create or replace function public.recompute_stylist_rating(p_stylist_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.stylists st
     set rating = coalesce(agg.avg_rating, 0)::numeric(2,1)
    from (
      select avg(rating)::numeric as avg_rating
      from public.reviews
      where stylist_id = p_stylist_id
    ) agg
   where st.id = p_stylist_id;
$$;

create or replace function public.on_reviews_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_salon_rating(old.salon_id);
    if old.stylist_id is not null then
      perform public.recompute_stylist_rating(old.stylist_id);
    end if;
    return old;
  end if;

  perform public.recompute_salon_rating(new.salon_id);
  if new.stylist_id is not null then
    perform public.recompute_stylist_rating(new.stylist_id);
  end if;
  -- If the stylist changed, recompute the old one too
  if tg_op = 'UPDATE' and old.stylist_id is not null and old.stylist_id is distinct from new.stylist_id then
    perform public.recompute_stylist_rating(old.stylist_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_aggregate on public.reviews;
create trigger reviews_aggregate
  after insert or update or delete on public.reviews
  for each row execute function public.on_reviews_change();

-- Constraint: a customer can only review their own completed queue entry once
create unique index if not exists reviews_one_per_entry
  on public.reviews (queue_entry_id)
  where queue_entry_id is not null;
