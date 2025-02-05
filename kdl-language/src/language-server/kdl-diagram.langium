import 'terminals'

// Diagram definition
KDLDiagram:
    ('kdlDiagram' | 'diagram') ':' 
    INDENT
        'id' ':' id=ID
        ('name' ':'  name=STRING)
        ('clusters' ':'
            INDENT 
                (LIST_ITEM clusters+=ClusterNode)+
            DEDENT
        )?
        CustomProperties?
    DEDENT
;


ClusterNode:
    'id' ':' id=ID
    ('name' ':'  name=STRING)
    'x' ':' x=NUMBER
    'y' ':' y=NUMBER
    'width' ':' width=NUMBER
    'height' ':' height=NUMBER
    CustomProperties?
;