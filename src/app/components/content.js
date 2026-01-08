'use client'

export default function Content({ className, children }) {

if (className) {
   return (
     <div className={ `${className} 2xl:mx-[15%] items-center place-self-center place-items-center justify-self-center py-5 md:px-20 px-4 w-full` }>
         { children }
     </div>
   );
} else {
   return (
       <div className="2xl:mx-[15%] items-center place-self-center place-items-center justify-self-center py-5 md:px-20 px-4 w-full">
          { children }
       </div>
)
}
}