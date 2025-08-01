import React from 'react';

// Skeleton loader for table rows
export const TableRowSkeleton = ({ columns = 6 }) => (
  <tr className="border-t border-gray-200 dark:border-gray-600 animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="py-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </td>
    ))}
  </tr>
);

// Skeleton loader for cards
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
    <div className="flex justify-between items-center mt-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="flex space-x-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

// Skeleton loader for stats cards
export const StatCardSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-600 animate-pulse">
    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
  </div>
);

// Skeleton loader for system overview cards
export const SystemOverviewSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
  </div>
);

// Loading spinner component
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin`}></div>
    </div>
  );
};

// Fade in animation wrapper
export const FadeIn = ({ children, delay = 0, className = "" }) => (
  <div 
    className={`animate-fadeIn ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      animationFillMode: 'both'
    }}
  >
    {children}
  </div>
);

// Slide up animation wrapper
export const SlideUp = ({ children, delay = 0, className = "" }) => (
  <div 
    className={`animate-slideUp ${className}`}
    style={{ 
      animationDelay: `${delay}ms`,
      animationFillMode: 'both'
    }}
  >
    {children}
  </div>
);

// Table loading component
export const TableLoading = ({ rows = 5, columns = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, index) => (
      <TableRowSkeleton key={index} columns={columns} />
    ))}
  </>
);

// Grid loading component for cards
export const GridLoading = ({ items = 6, CardComponent = CardSkeleton }) => (
  <>
    {Array.from({ length: items }).map((_, index) => (
      <CardComponent key={index} />
    ))}
  </>
);