const Thrower: React.FC = () => {
    return <button onClick={() => {
        throw new Error("test error from component");
    }}>Error Thrower component</button>
}

export default Thrower;