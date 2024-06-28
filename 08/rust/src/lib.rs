use core::panic;
use fnv::FnvBuildHasher;
use lazy_static::lazy_static;
use regex::Regex;
use std::{
    collections::{hash_map::RandomState, HashMap},
    hash::Hash,
};

/**
 * Public interface of a solver for the Advent of Code 2023 day 08 challenge part two.
 */
pub trait AOC8Solver<'a> {
    /**
     * Create a solver
     */
    fn new(walk_instructions: &'a str) -> Self;

    /**
     * Calculate the solution
     */
    fn solve(self: &Self) -> usize;
}

/**
 * Magic: Any Solver can also parse
 */
impl<'a, T: AOC8Solver<'a>> AOC8Parser for T {}

trait AOC8Parser {
    fn parse_challenge(input: &str) -> (&str, MyMap<&str, LeftRight>) {
        match input.trim().split("\n\n").collect::<Vec<&str>>()[0..2] {
            [lr, raw_map] => {
                let mut map = MyMap::default();
                raw_map
                    .split("\n")
                    .map(|line| {
                        MAP_PARSER
                            .captures(line)
                            .unwrap()
                            .iter()
                            .skip(1)
                            .map(|c| c.unwrap().as_str())
                            .collect::<Vec<&str>>()
                    })
                    .filter(|matches| matches.len() >= 3)
                    .for_each(|matches| {
                        map.insert(
                            matches[0],
                            LeftRight {
                                left: matches[1],
                                right: matches[2],
                            },
                        );
                    });
                (lr, map)
            }
            _ => {
                panic!("Problem during parsing")
            }
        }
    }

    fn walk_from_to(
        from: &str,
        to: &Regex,
        walk_instructions: &str,
        left_right_map: &MyMap<&str, LeftRight>,
        force_walk: &bool,
    ) -> usize {
        let mut current = from;
        let mut steps = 0;

        while !to.is_match(current) || (*force_walk && steps == 0) {
            let next_rl_instruction =
                walk_instructions.as_bytes()[steps % walk_instructions.len()] as char;
            let next_lr = left_right_map.get(current).unwrap();
            current = if next_rl_instruction == 'L' {
                &next_lr.left
            } else {
                &next_lr.right
            };
            steps += 1;
        }
        steps
    }

    fn get_all_locations_matching<'a>(
        matcher: &Regex,
        left_right_map: &MyMap<&'a str, LeftRight>,
    ) -> Vec<&'a str> {
        left_right_map
            .keys()
            .filter(|key| matcher.is_match(key))
            .map(|key| { *key })
            .collect()
    }
}

/**
 * This trait provides a general method to walk through all the steps and find the problem solution.
 * This implementation works irrespective of the underlying data structures.
 *
 * Only certain getters for the data structures must be provided, and the structures themselves must implement
 * the common `Accessor` trait
 */
trait AOC8Walker<K> {
    fn get_walk_instructions_len(self: &Self) -> usize;
    fn get_start_positions(self: &Self) -> &Vec<K>;
    fn get_itertools(self: &Self) -> &dyn Accessor<&K, Itertool>;
    fn get_jump_map(self: &Self) -> &dyn Accessor<&K, Vec<K>>;

    fn walk_by_jump_map(self: &Self) -> usize {
        let mut steps = 0;

        let mut last = 0;
        let print_every = 50_000_000_000;

        let walk_instructions_length = self.get_walk_instructions_len();

        let mut currents: Vec<&K> = self.get_start_positions().into_iter().collect();

        while !self.have_same_z_distance(&currents) {
            let full_length_jumps = self.max_z_distance(&currents) / walk_instructions_length;

            if full_length_jumps == 0 {
                panic!("Stuck!")
            }

            steps += full_length_jumps * walk_instructions_length;

            if steps - last >= print_every {
                println!("Now at {steps}");
                last = steps;
            }

            for current in &mut currents {
                *current = &self.get_jump_map().access(current)[full_length_jumps];
            }
        }

        steps + self.get_itertools().access(currents[0]).end_in_z_after
    }

    fn have_same_z_distance(self: &Self, keys: &Vec<&K>) -> bool {
        let z_distance_0 = self.get_itertools().access(keys[0]).end_in_z_after;
        for key in keys {
            if self.get_itertools().access(*key).end_in_z_after != z_distance_0 {
                return false;
            }
        }
        true
    }

    fn max_z_distance(self: &Self, currents: &Vec<&K>) -> usize {
        currents
            .iter()
            .map(|current| self.get_itertools().access(*current).next_z)
            .max()
            .unwrap_or(0)
    }
}

/**
 * Faster map with "custom" hasher.
 * Replace with any map implementation if you wish.
 */
type MyMap<K, V> = HashMap<K, V, FnvBuildHasher>;
// type MyMap<K, V> = BTreeMap<K, V>;

#[derive(Debug)]
pub struct LeftRight<'a> {
    left: &'a str,
    right: &'a str,
}

pub struct Itertool {
    /**
     * How many steps to take until we are at Z$. Can be 0
     */
    end_in_z_after: usize,
    /**
     * How far to the _next_ Z$. Can not be 0
     */
    next_z: usize,
}

type ItertoolMap<'a> = MyMap<&'a str, Itertool>;
type JumpMap<'a> = MyMap<&'a str, Vec<&'a str>>;

/**
 * Used to access maps and vecs using the same interface, to
 * be able to have a common walk implementation
 */
trait Accessor<K, V> {
    fn access(self: &Self, key: K) -> &V;
}

impl<K, V> Accessor<&K, V> for MyMap<K, V>
where
    K: PartialEq + Eq + Hash,
{
    fn access(self: &Self, key: &K) -> &V {
        self.get(key).unwrap()
    }
}

pub struct Walker<'a> {
    walk_instructions_len: usize,
    itertools: MyMap<&'a str, Itertool>,
    jump_map: JumpMap<'a>,
    start_positions: Vec<&'a str>,
}

/*
 * Create the jump map, which is done differently for both walkers and not public API,
 * so it does not make sense to include it in a trait
 */
impl<'a> Walker<'a> {
    fn create_jump_map(
        left_right_map: &MyMap<&'a str, LeftRight<'a>>,
        walk_instructions: &str,
    ) -> JumpMap<'a> {
        println!("Computing jump map");
        let all_keys = left_right_map.keys();
        let all_distances_to_z = all_keys.clone().map(|key| {
            Self::walk_from_to(&key, &END_IN_Z, walk_instructions, left_right_map, &false)
        });
        let max_distance = all_distances_to_z.max().unwrap();
        let max_jumpable_distance = max_distance - (max_distance % walk_instructions.len());
        println!("Max jumpable distance: {max_jumpable_distance}");
        let mut jump_map = MyMap::default();
        jump_map.extend(all_keys.map(|key| {
            let mut jump_list: Vec<&str> = vec![key];
            let mut current = key;
            for (i, lr) in (0..max_jumpable_distance).zip(walk_instructions.chars().cycle()) {
                let next_instruction = left_right_map.get(current).unwrap();
                let next = if lr == 'L' {
                    &next_instruction.left
                } else {
                    &next_instruction.right
                };
                if (i + 1) % walk_instructions.len() == 0 {
                    jump_list.push(next)
                };
                current = next;
            }
            (key.to_owned(), jump_list)
        }));
        println!("Computed jump map");
        jump_map
    }
}

impl<'a> AOC8Solver<'a> for Walker<'a> {
    fn new(input: &'a str) -> Self {
        // (&'a str, HashMap<&'a str, LeftRight<'a>)
        let (walk_instructions, left_right_map) = Self::parse_challenge(&input);
        println!("Creating new Walker");
        let mut itertools = ItertoolMap::default();
        itertools.extend(left_right_map.keys().map(|key| {
            let end_in_z_after =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &false);

            let next_z =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &true);

            (
                *key,
                Itertool {
                    end_in_z_after,
                    next_z,
                },
            )
        }));
        let jump_map = Self::create_jump_map(&left_right_map, &walk_instructions);
        let start_positions = Self::get_all_locations_matching(&END_IN_A, &left_right_map);
        println!("Created new Walker");
        Self {
            walk_instructions_len: walk_instructions.len(),
            itertools,
            start_positions,
            jump_map,
        }
    }

    fn solve(self: &Self) -> usize {
        self.walk_by_jump_map()
    }
}

impl<'a> AOC8Walker<&'a str> for Walker<'a> {
    fn get_walk_instructions_len(self: &Self) -> usize {
        self.walk_instructions_len
    }

    fn get_jump_map(self: &Walker<'a>) -> &dyn Accessor<&&'a str, Vec<&'a str>> {
        &self.jump_map
    }

    fn get_start_positions(self: &Self) -> &Vec<&'a str> {
        &self.start_positions
    }

    fn get_itertools(self: &Self) -> &dyn Accessor<&&'a str, Itertool> {
        &self.itertools
    }
}

type PowerItertoolMap = Vec<Itertool>;
type PowerJumpMap = Vec<Vec<usize>>;

impl<V> Accessor<&usize, V> for Vec<V> {
    fn access(self: &Self, key: &usize) -> &V {
        &self[*key]
    }
}

pub struct PowerWalker {
    walk_instructions_len: usize,
    itertools: Vec<Itertool>,
    start_positions: Vec<usize>,
    jump_map: PowerJumpMap,
}

impl PowerWalker {
    fn create_jump_map(
        walk_instructions: &str,
        left_right_map: &MyMap<&str, LeftRight>,
        str_to_usize: &HashMap<&str, usize>,
    ) -> PowerJumpMap {
        let all_keys = left_right_map.keys();
        let all_distances_to_z = all_keys.clone().map(|key| {
            Self::walk_from_to(&key, &END_IN_Z, walk_instructions, left_right_map, &false)
        });
        let max_distance = all_distances_to_z.max().unwrap();
        let max_jumpable_distance = max_distance - (max_distance % walk_instructions.len());
        println!("Max jumpable distance: {max_jumpable_distance}");
        let jump_map = all_keys
            .map(|key| {
                let mut jump_list: Vec<usize> = vec![*str_to_usize.get(key).unwrap()];
                let mut current = key;
                for (i, lr) in (0..max_jumpable_distance).zip(walk_instructions.chars().cycle()) {
                    let next_instruction = left_right_map.get(current).unwrap();
                    let next = if lr == 'L' {
                        &next_instruction.left
                    } else {
                        &next_instruction.right
                    };
                    if (i + 1) % walk_instructions.len() == 0 {
                        jump_list.push(*str_to_usize.get(next).unwrap())
                    };
                    current = next;
                }
                jump_list
            })
            .collect();
        println!("Computed jump map");
        jump_map
    }
}

impl<'a> AOC8Solver<'a> for PowerWalker {
    fn new(input: &'a str) -> Self {
        println!("Creating new PowerWalker");
        let (walk_instructions, left_right_map) = Self::parse_challenge(&input);
        let mut itertools = PowerItertoolMap::with_capacity(left_right_map.len());

        let str_to_usize = HashMap::<&str, usize, RandomState>::from_iter(
            left_right_map
                .keys()
                .enumerate()
                .map(|(index, key)| (*key, index)),
        );

        itertools.extend(left_right_map.keys().map(|key| {
            let end_in_z_after =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &false);
            let next_z =
                Self::walk_from_to(key, &END_IN_Z, &walk_instructions, &left_right_map, &true);
            Itertool {
                end_in_z_after,
                next_z,
            }
        }));

        let rust_temporary = Self::get_all_locations_matching(&END_IN_A, &left_right_map);
        let start_positions = rust_temporary
            .iter()
            .map(|x| str_to_usize.get(x).unwrap().to_owned())
            .collect();
        let jump_map = Self::create_jump_map(&walk_instructions, &left_right_map, &str_to_usize);

        println!("Created new PowerWalker");
        Self {
            jump_map,
            walk_instructions_len: walk_instructions.len(),
            itertools,
            start_positions,
        }
    }

    fn solve(self: &Self) -> usize {
        self.walk_by_jump_map()
    }
}

impl AOC8Walker<usize> for PowerWalker {
    fn get_walk_instructions_len(self: &Self) -> usize {
        self.walk_instructions_len
    }

    fn get_itertools(self: &Self) -> &dyn Accessor<&usize, Itertool> {
        &self.itertools
    }

    fn get_start_positions(self: &Self) -> &Vec<usize> {
        &self.start_positions
    }

    fn get_jump_map(self: &Self) -> &dyn Accessor<&usize, Vec<usize>> {
        &self.jump_map
    }
}

lazy_static! {
    static ref END_IN_Z: Regex = Regex::new("Z$").unwrap();
    static ref END_IN_A: Regex = Regex::new("A$").unwrap();
    static ref MAP_PARSER: Regex =
        Regex::new("^([A-Z0-9]{3}) = \\(([A-Z0-9]{3}), ([A-Z0-9]{3})\\)$").unwrap();
}
