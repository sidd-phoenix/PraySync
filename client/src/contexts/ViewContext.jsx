import { createContext, useContext, useState } from "react";

const ViewContext=createContext();

export const useView = () =>{
    const context=useContext(ViewContext);

    if(!context){
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}

export const ViewProvider = ({children}) =>{
    const [view, setView]=useState('home'); //Default view

    const value={
        view,
        setView
    }

    return(
        <ViewContext.Provider value={value}>
            {children}
        </ViewContext.Provider>
    )
}