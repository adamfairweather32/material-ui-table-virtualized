import React, { Component, forwardRef } from 'react';
import StyledOutlinedInput from '../../styled/StyledOutlinedInput';

class DataTableTextEditor extends Component {
    render() {
        const { id, inputRef, onBlur } = this.props;
        return <StyledOutlinedInput id={id} onBlur={onBlur} variant="outlined" inputRef={inputRef} />;
    }
}

export default forwardRef((props, ref) => <DataTableTextEditor {...props} inputRef={ref} />);
