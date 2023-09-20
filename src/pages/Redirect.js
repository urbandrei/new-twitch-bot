import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Redirect = () => {
        const location = useLocation();
        const navigate = useNavigate();

        useEffect(() => {
                const queryParams = new URLSearchParams(location.search);
                const code = queryParams.get('code');
                console.log(code);
                if(code != null) {
                        console.log("this hapened");
                fetch('http://localhost:5000/code', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ data: code }),
                });
                }
                navigate('/home');
        }, [location.search, navigate]);

        return (
                <div>
                <p>Loading...</p>
                </div>
        );
};

export default Redirect;
