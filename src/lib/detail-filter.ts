export function searchKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function filterDetailItems<T>(items: T[], query: string, searchText: (item: T) => string, matchesFilter?: (item: T) => boolean) {
  const term = searchKey(query.trim());
  return items.filter((item) => (!term || searchKey(searchText(item)).includes(term)) && (!matchesFilter || matchesFilter(item)));
}
