/**
 * SearchFilter - Componente padronizado de busca e filtros mobile-first
 */
import { Search, X, ArrowUpDown } from 'lucide-react'

export default function SearchFilter({
  searchValue,
  onSearchChange,
  onClearSearch,
  placeholder = "Buscar...",
  sortOptions,
  sortValue,
  onSortChange,
  filterOptions,
  resultsCount,
  totalCount,
  entityName = "item"
}) {
  return (
    <div className="card p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchValue && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters & Sort - Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Filter Dropdowns */}
          {filterOptions?.map((filter, idx) => (
            <select
              key={idx}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{filter.placeholder}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Sort Dropdown */}
          {sortOptions && (
            <select
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Mobile Filters */}
      {filterOptions && filterOptions.length > 0 && (
        <div className="sm:hidden flex gap-2 mt-3">
          {filterOptions.map((filter, idx) => (
            <select
              key={idx}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{filter.placeholder}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Results Count */}
      {resultsCount !== undefined && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            {searchValue || (filterOptions && filterOptions.some(f => f.value)) ? (
              <>
                <span className="font-medium">{resultsCount}</span> resultado{resultsCount !== 1 ? 's' : ''}
                {totalCount > 0 && <span className="text-gray-400"> de {totalCount}</span>}
              </>
            ) : (
              <>
                <span className="font-medium">{totalCount}</span> {entityName}{totalCount !== 1 ? 's' : ''}
              </>
            )}
          </p>

          {/* Mobile Sort Toggle */}
          {sortOptions && (
            <button
              onClick={() => {
                const currentIdx = sortOptions.findIndex(opt => opt.value === sortValue)
                const nextIdx = (currentIdx + 1) % sortOptions.length
                onSortChange(sortOptions[nextIdx].value)
              }}
              className="sm:hidden flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <ArrowUpDown size={14} />
              <span>Ordenar</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
