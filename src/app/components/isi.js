'use client'

export default function Isi({ className, children }) {

if (className) {
   return (
     <div className={ `h-full m-0 ${className}` }>
         { children }
     </div>
   );
} else {
   return (
       <div className="h-full m-0">
          { children }
       </div>
)
}
}
